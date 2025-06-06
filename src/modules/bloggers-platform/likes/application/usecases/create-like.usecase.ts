import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLikeDto } from '../../dto/like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { Like, LikeDocument, LikeModelType } from '../../domain/like.entity';

export class CreateLikeCommand {
  constructor(public readonly dto: CreateLikeDto) {}
}

@CommandHandler(CreateLikeCommand)
export class CreateLikeUseCase implements ICommandHandler<CreateLikeCommand> {
  constructor(
    private readonly likesRepository: LikesRepository,
    @InjectModel(Like.name) private LikeModel: LikeModelType,
  ) {}

  async execute({ dto }: CreateLikeCommand): Promise<string> {
    const like: LikeDocument = this.LikeModel.createInstance(dto);

    return await this.likesRepository.save(like);
  }
}
