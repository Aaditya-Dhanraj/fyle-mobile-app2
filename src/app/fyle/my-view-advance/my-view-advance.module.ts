import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyViewAdvancePageRoutingModule } from './my-view-advance-routing.module';

import { MyViewAdvancePage } from './my-view-advance.page';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, MyViewAdvancePageRoutingModule, MatIconModule],
  declarations: [MyViewAdvancePage],
})
export class MyViewAdvancePageModule {}
