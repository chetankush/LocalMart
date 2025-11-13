import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard } from "../../shared/guards/auth.guard";
import { RolesGuard } from "../../shared/guards/roles.guard";
import { Roles } from "../../shared/decorators/roles.decorator";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("reviews")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getStoreReviews(
    @Query("vendorId") vendorId?: string,
    @Query("rating") rating?: string,
    @Query("isHidden") isHidden?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const result = await this.adminService.getStoreReviews({
      vendorId,
      rating: rating ? parseInt(rating) : undefined,
      isHidden:
        isHidden === "true" ? true : isHidden === "false" ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return { success: true, data: result };
  }

  @Patch("reviews/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async updateStoreReview(
    @Param("id") id: string,
    @Body() dto: { isHidden?: boolean; isApproved?: boolean }
  ) {
    const review = await this.adminService.updateStoreReview(id, dto);
    return {
      success: true,
      message: "Review updated successfully",
      data: review,
    };
  }

  @Delete("reviews/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async deleteStoreReview(@Param("id") id: string) {
    await this.adminService.deleteStoreReview(id);
    return { success: true, message: "Review deleted successfully" };
  }

  @Get("product-reviews")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async getProductReviews(
    @Query("productId") productId?: string,
    @Query("rating") rating?: string,
    @Query("isHidden") isHidden?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const result = await this.adminService.getProductReviews({
      productId,
      rating: rating ? parseInt(rating) : undefined,
      isHidden:
        isHidden === "true" ? true : isHidden === "false" ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return { success: true, data: result };
  }

  @Patch("product-reviews/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async updateProductReview(
    @Param("id") id: string,
    @Body() dto: { isHidden?: boolean; isApproved?: boolean }
  ) {
    const review = await this.adminService.updateProductReview(id, dto);
    return {
      success: true,
      message: "Review updated successfully",
      data: review,
    };
  }

  @Delete("product-reviews/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async deleteProductReview(@Param("id") id: string) {
    await this.adminService.deleteProductReview(id);
    return { success: true, message: "Review deleted successfully" };
  }
}
