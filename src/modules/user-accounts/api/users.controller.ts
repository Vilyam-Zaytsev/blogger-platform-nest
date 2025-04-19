import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UriParamId } from '../../../core/types/input-types';

@Controller('users')
export class UsersController {
  @Get()
  async getUsers(@Query() query: any) {}

  @Post()
  async createUser(@Body() body: any) {}

  @Delete(':id')
  async deleteUser(@Param('id') params: UriParamId) {}
}
