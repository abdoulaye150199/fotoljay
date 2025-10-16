import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './product-list/product-list';
import { ProductDetail } from './product-detail/product-detail';
import { CameraCapture } from './camera-capture/camera-capture';
import { authGuard } from '../../core/auth-guard';

const routes: Routes = [
  {
    path: '',
    component: ProductList
  },
  {
    path: 'new',
    component: CameraCapture,
    canActivate: [authGuard]
  },
  {
    path: ':id',
    component: ProductDetail
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
