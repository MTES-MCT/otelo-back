import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from '~/auth/auth.service'
import { User } from '~/common/decorators/authenticated-user'
import { Public } from '~/common/decorators/public.decorator'
import { RefreshTokenGuard } from '~/common/guards/refreshtoken.guard'
import { TSignupCallback, ZSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TUser } from '~/schemas/users/user'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() signinUserDto: TSignupCallback) {
    const validatedData = ZSignupCallback.parse(signinUserDto)

    return this.authService.validateSignIn(validatedData)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() request: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, token] = request.headers.authorization?.split(' ') ?? []
    const refreshedUserSession = await this.authService.refreshToken(token)
    request['user'] = refreshedUserSession.user as TUser
    return refreshedUserSession
  }

  @Public()
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@User() { id: userId }: TUser) {
    return this.authService.logout(userId)
  }
}
