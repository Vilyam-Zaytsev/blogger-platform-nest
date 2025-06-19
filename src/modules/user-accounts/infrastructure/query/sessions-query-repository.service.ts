import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../domain/entities/session/session.entity';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';

@Injectable()
export class SessionsQueryRepository {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  async getByUserId(userId: string): Promise<SessionViewDto[]> {
    const filter: FilterQuery<Session> = {
      userId,
      deletedAt: null,
    };

    const sessions: SessionDocument[] = await this.SessionModel.find(filter);

    return sessions.map(
      (session: SessionDocument): SessionViewDto =>
        SessionViewDto.mapToView(session),
    );
  }
}
