import { Controller, Delete, Get, Post } from '@nestjs/common';

@Controller('users')
class UsersController {
  @Get()
  async getUsers() {}

  @Post()
  async createUsers() {}

  @Delete()
  async deleteUsers() {}
}

export { UsersController };
