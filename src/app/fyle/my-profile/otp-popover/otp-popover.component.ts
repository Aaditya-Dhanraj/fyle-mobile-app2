import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { OrgUserService } from 'src/app/core/services/org-user.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import {switchMap, tap} from 'rxjs/operators';
import { from } from 'rxjs';
import {TrackingService} from '../../../core/services/tracking.service';

@Component({
  selector: 'app-otp-popover',
  templateUrl: './otp-popover.component.html',
  styleUrls: ['./otp-popover.component.scss'],
})
export class OtpPopoverComponent implements OnInit {

  @Input() phoneNumber: string;
  otp: number;
  canRequestResendOTP = false;
  otpInfoMessage = '';
  otpInfoClass = '';
  isApiCallInProgress = false;

  constructor(
    private popoverController: PopoverController,
    private orgUserService: OrgUserService,
    private authService: AuthService,
    private loaderService: LoaderService,
    private trackingService: TrackingService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.canRequestResendOTP = true;
    }, 30000);
  }

  cancel() {
    this.popoverController.dismiss();
  }

  resendOtp(event) {
    this.orgUserService.verifyMobile().subscribe(() => {
      this.canRequestResendOTP = false;
      this.otpInfoClass = 'text-center';
      this.otpInfoMessage = 'OTP sent again';
      setTimeout(() => {
        this.canRequestResendOTP = true;
      }, 30 * 1000);
    }, (err) => {
      this.otpInfoClass = 'text-danger';
      this.otpInfoMessage = 'Unable to send OTP. Please try after sometime';
    });
  }

  verifyOtp(event) {
    const that = this;
    that.isApiCallInProgress = true;
    that.orgUserService.checkMobileVerificationCode(that.otp).pipe(
      switchMap(() => {
        return that.authService.refreshEou();
      }),
      tap(() => this.trackingService.activated({Asset: 'Mobile'})),
      switchMap(() => {
        return from(this.loaderService.showLoader('Mobile verified', 1000));
      })
    ).subscribe(
      () => {
        this.popoverController.dismiss();
      },
      (err) => {
        if (err.data.message === 'Invalid OTP') {
          that.otpInfoClass = 'text-danger';
          that.otpInfoMessage = 'Incorrect OTP';
        }
      },
      () => {
        that.isApiCallInProgress = false;
      });
  }
}
