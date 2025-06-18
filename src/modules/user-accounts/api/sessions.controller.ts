import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';

@Controller('security/devices')
@UseGuards(JwtRefreshAuthGuard)
export class SessionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getAll() {}
}
