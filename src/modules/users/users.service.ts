import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserCommand } from './commands/create-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { RemoveUserCommand } from './commands/remove-user.command';
import { GetUsersQuery } from './queries/get-users.query';
import { GetUserQuery } from './queries/get-user.query';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.commandBus.execute(new CreateUserCommand(createUserDto));
  }

  findAll(): Promise<User[]> {
    return this.queryBus.execute(new GetUsersQuery());
  }

  async findOneById(id: string): Promise<User> {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return this.usersRepository.findOne(options);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.commandBus.execute(new UpdateUserCommand(id, updateUserDto));
  }

  async remove(id: string): Promise<void> {
    return this.commandBus.execute(new RemoveUserCommand(id));
  }
}
