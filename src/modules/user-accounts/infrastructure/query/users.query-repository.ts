import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UsersViewDto } from '../../api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UsersViewDto> {
    const user: UserDocument | null = await this.UserModel.findOne({
      _id: id,
      deleted: null,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UsersViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UsersViewDto>> {
    const filter: FilterQuery<User> = {
      deletedAt: null,
    };

    if (query.searchLoginTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        login: { $regex: query.searchLoginTerm, $options: 'i' },
      });
    }

    if (query.searchEmailTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        email: { $regex: query.searchEmailTerm, $options: 'i' },
      });
    }

    const users: UserDocument[] = await this.UserModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount: number = await this.UserModel.countDocuments(filter);

    const items: UsersViewDto[] = users.map(
      (user: UserDocument): UsersViewDto => UsersViewDto.mapToView(user),
    );

    return PaginatedViewDto.mapToView<UsersViewDto>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
