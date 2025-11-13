import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('product')
  @UseGuards(AuthGuard)
  async createProductReview(
    @CurrentUser() user: any,
    @Body() createReviewDto: {
      productId: string;
      rating: number;
      comment?: string;
      images?: any;
    },
  ) {
    const review = await this.reviewsService.createProductReview(
      user.id,
      createReviewDto,
    );
    return {
      success: true,
      message: 'Review submitted successfully',
      review,
    };
  }

  @Post('store')
  @UseGuards(AuthGuard)
  async createStoreReview(
    @CurrentUser() user: any,
    @Body() createReviewDto: {
      vendorId: string;
      rating: number;
      comment?: string;
      images?: any;
    },
  ) {
    const review = await this.reviewsService.createStoreReview(
      user.id,
      createReviewDto,
    );
    return {
      success: true,
      message: 'Review submitted successfully',
      review,
    };
  }

  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewsService.getProductReviews(productId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    return { success: true, data: result };
  }

  @Get('store/:vendorId')
  async getStoreReviews(@Param('vendorId') vendorId: string) {
    const reviews = await this.reviewsService.getStoreReviews(vendorId);
    return { success: true, data: reviews };
  }
}
