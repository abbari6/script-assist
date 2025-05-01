export class ValidateUserRolesQuery {
  constructor(
    public readonly userId: string,
    public readonly requiredRoles: string[],
  ) {}
}
