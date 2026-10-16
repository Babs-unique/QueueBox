import { Controller, Body,  Req, HttpException, HttpStatus, ParseUUIDPipe, Get, Post, UseGuards, Param, Patch, Delete} from '@nestjs/common';
import type { Response } from 'express'
import { CustomerService } from './customer.service';
import type { AuthenticatedRequest } from '../utils/auth-request'
import { AuthGuard } from '../auth/guards/auth.guard';
import { customerDtos } from './dto/customer.dto'



@Controller('customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {};

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() customerDto:customerDtos, @Req()  req:AuthenticatedRequest) {
        const userId = req.user.sub
         if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        return this.customerService.createCustomer(userId , customerDto);
    }
    @UseGuards(AuthGuard)
    @Get()
    getCustomers(@Req() req:AuthenticatedRequest){
        const userId = req.user.sub
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        return this.customerService.getCustomers(userId);
    }
    @UseGuards(AuthGuard)
    @Get(':id')
    getCustomer(@Param('id' , ParseUUIDPipe) id:string, @Req() req:AuthenticatedRequest){
        const userId = req.user.sub
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        return this.customerService.getCustomerById(id, userId);
    }
    @UseGuards(AuthGuard)
    @Patch(':id')
    updateCustomer(@Param('id' , ParseUUIDPipe) id:string, @Body() customerDto:customerDtos, @Req() req:AuthenticatedRequest){
        const userId = req.user.sub
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        return this.customerService.updateCustomer(userId , id , customerDto);
    }
    @UseGuards(AuthGuard)
    @Delete(':id')
    deleteCustomer(@Param('id' , ParseUUIDPipe) id:string, @Req() req:AuthenticatedRequest){
        const userId = req.user.sub
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        return this.customerService.deleteCustomer(id, userId);
    }
}
