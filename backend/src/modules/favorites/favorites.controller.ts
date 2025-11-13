import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@CurrentUser() user: any) {
    const favorites = await this.favoritesService.findAll(user.id);
    return {
      favorites: favorites.map((fav) => ({
        id: fav.id,
        vendor: fav.vendor,
        createdAt: fav.createdAt,
      })),
    };
  }

  @Post('toggle')
  @UseGuards(AuthGuard)
  async toggle(@CurrentUser() user: any, @Body() dto: { vendorId: string }) {
    const result = await this.favoritesService.toggle(user.id, dto.vendorId);
    return result;
  }
}

