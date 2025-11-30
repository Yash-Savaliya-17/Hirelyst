import {Injectable} from '@nestjs/common';
import {Prisma, User} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';

type TransactionPrisma = Pick<PrismaService, 'user'>;

@Injectable()
export class UsersRepository {
    constructor(private prisma: PrismaService) {
    }

    findUser(
        userWhereUniqueInput: Prisma.UserWhereUniqueInput,
    ): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput,
        });
    }

    findUsers(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const {skip, take, cursor, where, orderBy} = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    createUser(
        data: Prisma.UserCreateInput,
        _prisma: TransactionPrisma = this.prisma,
    ): Promise<User> {
        const uData: any = data;
        delete uData.sys_id;
        return _prisma.user.create({
            data: uData,
        });
    }

    updateUser(
        params: {
            where: Prisma.UserWhereUniqueInput;
            data: Prisma.UserUpdateInput;
        },
        _prisma: TransactionPrisma = this.prisma,
    ): Promise<User> {
        const {where, data} = params;
        return _prisma.user.update({
            data,
            where,
        });
    }

    deleteUser(
        where: Prisma.UserWhereUniqueInput,
        _prisma: TransactionPrisma = this.prisma,
    ): Promise<User> {
        return this.prisma.user.delete({
            where,
        });
    }

    changePassword(userId: number, newPassword: string) {
        return this.prisma.user.update({
            where: {
                sys_id: userId,
            },
            data: {
                password: newPassword,
                isPasswordSet: true
            },
        });
    }
}
