import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { VendorsModule } from "./modules/vendors/vendors.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { UsersModule } from "./modules/users/users.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SearchModule } from "./modules/search/search.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { VendorRequestsModule } from "./modules/vendor-requests/vendor-requests.module";
import { VendorModule } from "./modules/vendor/vendor.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    VendorsModule,
    VendorModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    UsersModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    SearchModule,
    FavoritesModule,
    VendorRequestsModule,
  ],
})
export class AppModule {}
