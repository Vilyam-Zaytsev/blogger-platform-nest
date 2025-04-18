class UsersViewDto {
  id: string;
  email: string;
  login: string;
  createdAt: string;

  // static mapToViewModel(user): UsersViewDto {
  //   const dto = new this();
  //
  //   dto.id = String(user._id);
  //   dto.login = user.login;
  //   dto.email = user.email;
  //   dto.createdAt = user.createdAt;
  //
  //   return dto;
  // }
}

export { UsersViewDto };
