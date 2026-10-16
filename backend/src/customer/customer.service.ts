import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { customerDtos } from './dto/customer.dto.js';
import { Customer } from '../../generated/prisma/client.js'


@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) {}

    async createCustomer(userId: string , dto:customerDtos): Promise<Customer> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const customer = await this.prisma.customer.create({ data: { ...dto, userId } });
        return customer
    }

    async getCustomers(userId: string): Promise<Customer[]> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const customers = await this.prisma.customer.findMany({ where: { userId } });
        return customers
    }

    async getCustomerById( userId: string , id:string): Promise<Customer> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const customer = await this.prisma.customer.findFirst({ where: { id:id , userId: userId } });
        if(!customer) throw new NotFoundException('Customer not found or Access Denied');
        return customer
    }

    async deleteCustomer(userId: string , id:string): Promise<Customer> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const customer = await this.prisma.customer.findFirst({ where: { id:id , userId: userId } });
        if(!customer) throw new NotFoundException('Customer not found or Access Denied');
        const deletedCustomer = await this.prisma.customer.delete({ where: { id } });
        return deletedCustomer
    }

    async updateCustomer(userId: string , id:string , dto:customerDtos): Promise<Customer> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const customer = await this.prisma.customer.findFirst({ where: { id:id , userId: userId } });
        if(!customer) throw new NotFoundException('Customer not found or Access Denied');
        const updatedCustomer = await this.prisma.customer.update({ where: { id }, data: { ...dto } });
        return updatedCustomer
    }

}
