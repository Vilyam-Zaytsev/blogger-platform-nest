import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReactionDto } from '../../dto/reaction.dto';
import { ReactionsRepository } from '../../infrastructure/reactions-repository';
import {
  Reaction,
  ReactionDocument,
  ReactionModelType,
} from '../../domain/reaction.entity';

export class CreateReactionCommand {
  constructor(public readonly dto: CreateReactionDto) {}
}

@CommandHandler(CreateReactionCommand)
export class CreateReactionUseCase
  implements ICommandHandler<CreateReactionCommand>
{
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    @InjectModel(Reaction.name) private ReactionModel: ReactionModelType,
  ) {}

  async execute({ dto }: CreateReactionCommand): Promise<string> {
    const reaction: ReactionDocument = this.ReactionModel.createInstance(dto);

    return await this.reactionsRepository.save(reaction);
  }
}
