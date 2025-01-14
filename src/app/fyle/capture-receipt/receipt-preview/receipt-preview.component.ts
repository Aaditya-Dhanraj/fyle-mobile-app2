import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
import { ActionSheetController, ModalController, Platform, PopoverController } from '@ionic/angular';
import { from } from 'rxjs';
import { PopupAlertComponentComponent } from 'src/app/shared/components/popup-alert-component/popup-alert-component.component';
import { AddMorePopupComponent } from '../add-more-popup/add-more-popup.component';

type Image = Partial<{
  source: string;
  base64Image: string;
}>;
@Component({
  selector: 'app-receipt-preview',
  templateUrl: './receipt-preview.component.html',
  styleUrls: ['./receipt-preview.component.scss'],
})
export class ReceiptPreviewComponent implements OnInit {
  @ViewChild('slides') imageSlides: any;

  @Input() base64ImagesWithSource: Image[];

  @Input() mode: string;

  sliderOptions: { initialSlide: number; slidesPerView: number; autoHeight: boolean; zoom: { maxRatio: number } };

  activeIndex: number;

  constructor(
    private platform: Platform,
    private modalController: ModalController,
    private popoverController: PopoverController,
    private actionSheetController: ActionSheetController,
    private matBottomSheet: MatBottomSheet,
    private imagePicker: ImagePicker
  ) {
    this.registerBackButtonAction();
  }

  registerBackButtonAction() {
    this.platform.backButton.subscribe(async () => {
      this.retake();
    });
  }

  ngOnInit() {
    this.sliderOptions = {
      initialSlide: 0,
      slidesPerView: 1,
      autoHeight: true,
      zoom: {
        maxRatio: 1,
      },
    };
    this.activeIndex = 0;
  }

  ionViewWillEnter() {
    this.imageSlides.update();
  }

  async finish() {
    this.modalController.dismiss({
      base64ImagesWithSource: this.base64ImagesWithSource,
    });
  }

  async close() {
    let message;
    if (this.base64ImagesWithSource.length > 1) {
      message = `Are you sure you want to discard the ${this.base64ImagesWithSource.length} receipts you just captured?`;
    } else {
      message = 'Not a good picture? No worries. Discard and click again.';
    }
    const closePopOver = await this.popoverController.create({
      component: PopupAlertComponentComponent,
      componentProps: {
        title: 'Discard Receipt',
        message,
        primaryCta: {
          text: 'Discard',
          action: 'discard',
          type: 'alert',
        },
        secondaryCta: {
          text: 'Cancel',
          action: 'cancel',
        },
      },
      cssClass: 'pop-up-in-center',
    });

    await closePopOver.present();

    const { data } = await closePopOver.onWillDismiss();

    if (data && data.action) {
      if (data.action === 'discard') {
        this.retake();
      }
    }
  }

  async addMore() {
    const addMoreDialog = this.matBottomSheet.open(AddMorePopupComponent, {
      data: {},
      panelClass: ['mat-bottom-sheet-2'],
    });

    const data = await addMoreDialog.afterDismissed().toPromise();
    if (data) {
      if (data.mode === 'camera') {
        this.captureReceipts();
      } else {
        this.galleryUpload();
      }
    }
  }

  galleryUpload() {
    this.imagePicker.hasReadPermission().then((permission) => {
      if (permission) {
        const options = {
          maximumImagesCount: 10,
          outputType: 1,
          quality: 70,
        };
        // If android app start crashing then convert outputType to 0 to get file path and then convert it to base64 before upload to s3.
        from(this.imagePicker.getPictures(options)).subscribe(async (imageBase64Strings) => {
          if (imageBase64Strings.length > 0) {
            imageBase64Strings.forEach((base64String, key) => {
              const base64PictureData = 'data:image/jpeg;base64,' + base64String;
              this.base64ImagesWithSource.push({
                source: 'MOBILE_DASHCAM_GALLERY',
                base64Image: base64PictureData,
              });
            });
          }
        });
      } else {
        this.imagePicker.requestReadPermission();
        this.galleryUpload();
      }
    });
  }

  captureReceipts() {
    this.modalController.dismiss({
      base64ImagesWithSource: this.base64ImagesWithSource,
      continueCaptureReceipt: true,
    });
  }

  async delete() {
    const activeIndex = await this.imageSlides.getActiveIndex();
    const deletePopOver = await this.popoverController.create({
      component: PopupAlertComponentComponent,
      componentProps: {
        title: 'Remove Receipt',
        message: 'Are you sure you want to remove this receipt?',
        primaryCta: {
          text: 'Remove',
          action: 'remove',
          type: 'alert',
        },
        secondaryCta: {
          text: 'Cancel',
          action: 'cancel',
        },
      },
      cssClass: 'pop-up-in-center',
    });

    await deletePopOver.present();

    const { data } = await deletePopOver.onWillDismiss();

    if (data && data.action) {
      if (data.action === 'remove') {
        this.base64ImagesWithSource.splice(activeIndex, 1);
        if (this.base64ImagesWithSource.length === 0) {
          this.retake();
        } else {
          await this.imageSlides.update();
          this.activeIndex = await this.imageSlides.getActiveIndex();
        }
      }
    }
  }

  retake() {
    this.base64ImagesWithSource = [];
    this.modalController.dismiss({
      base64ImagesWithSource: this.base64ImagesWithSource,
    });
  }

  async goToNextSlide() {
    await this.imageSlides.slideNext();
    await this.imageSlides.update();
  }

  async goToPrevSlide() {
    await this.imageSlides.slidePrev();
    await this.imageSlides.update();
  }

  async ionSlideDidChange() {
    const activeIndex = await this.imageSlides.getActiveIndex();
    this.activeIndex = activeIndex;
  }
}
