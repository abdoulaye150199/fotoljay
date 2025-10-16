import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthForm } from './auth-form/auth-form';

const routes: Routes = [
  {
    path: '',
    component: AuthForm,
    data: { mode: 'login' }
  },
  {
    path: 'register',
    component: AuthForm,
    data: { mode: 'register' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
