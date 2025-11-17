import { Controller, Get, Post, Delete, Body, UseGuards, Query, Param } from '@nestjs/common';
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
    try {
      const review = await this.reviewsService.createProductReview(
        user.id,
        createReviewDto,
      );
      return {
        success: true,
        message: 'Review submitted successfully',
        review,
      };
    } catch (error) {
      // Re-throw the error, NestJS will handle it with proper HTTP status
      throw error;
    }
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
    try {
      const review = await this.reviewsService.createStoreReview(
        user.id,
        createReviewDto,
      );
      return {
        success: true,
        message: 'Review submitted successfully',
        review,
      };
    } catch (error) {
      // Re-throw the error, NestJS will handle it with proper HTTP status
      throw error;
    }
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

  @Delete('store/:id')
  @UseGuards(AuthGuard)
  async deleteStoreReview(
    @CurrentUser() user: any,
    @Param('id') reviewId: string,
  ) {
    try {
      await this.reviewsService.deleteStoreReview(user.id, reviewId);
      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('product/:id')
  @UseGuards(AuthGuard)
  async deleteProductReview(
    @CurrentUser() user: any,
    @Param('id') reviewId: string,
  ) {
    try {
      await this.reviewsService.deleteProductReview(user.id, reviewId);
      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
