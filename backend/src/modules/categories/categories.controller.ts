import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { AuthGuard } from "../../shared/guards/auth.guard";
import { RolesGuard } from "../../shared/guards/roles.guard";
import { Roles } from "../../shared/decorators/roles.decorator";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return { success: true, data: categories };
  }

  @Get("check")
  async checkCategories() {
    const count = await this.categoriesService.count();
    return { hasCategories: count > 0, count };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("VENDOR", "ADMIN")
  async create(@Body() createCategoryDto: { name: string }) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      success: true,
      message: "Category created successfully",
      data: category,
    };
  }
}
