import { Controller, Post, Body } from '@nestjs/common';
import { LoginUseCase } from '../../Application/Use-cases/login.use-case';

// Finish this later and include all the stuff with the code and random url and stuff (random url is here or on front?)

@Controller('admin')
export class AdminController {

  constructor(private loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() user: { username: string, id: number }) {
    
    return this.loginUseCase.execute(user.username, user.id);
  }
}