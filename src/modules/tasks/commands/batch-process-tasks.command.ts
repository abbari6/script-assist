export class BatchProcessTasksCommand {
  constructor(
    public readonly userId: string,
    public readonly taskIds: string[],
    public readonly action: 'complete' | 'delete',
  ) {}
}
