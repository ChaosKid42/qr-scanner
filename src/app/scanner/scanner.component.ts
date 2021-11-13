import {Component, OnInit} from '@angular/core';
import {AlertController} from '@ionic/angular';
import {ActionService} from '../shared/services/action.service';
import {take, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import * as cbor from 'cbor-web';
import * as b45 from 'base45-web';

@Component({
    selector: 'app-scanner',
    templateUrl: './scanner.component.html',
    styleUrls: ['./scanner.component.scss'],
})
export class ScannerComponent implements OnInit {

    availableCameras: MediaDeviceInfo[];
    currentDevice: MediaDeviceInfo = null;
    torchEnabled = false;
    torchCompatible = false;

    private currentCameraIndex = 0;

    constructor(private alertController: AlertController,
        private actionService: ActionService,
        private router: Router) {
    }

    ngOnInit() {
    }

    onHasPermission(hasPermissions: boolean): void {
        if (!hasPermissions) {
            this.alertController.create({
                header: 'No permission',
                message: 'To use this application you need to give permission to use the camera.',
                buttons: ['Ok']
            }).then(alert => alert.present());
        }
    }

    onIsTorchCompatible(compatible: boolean): void {
        this.torchCompatible = compatible;
    }

    onCamerasFound(cameras: MediaDeviceInfo[]): void {
        this.availableCameras = cameras;
        this.currentDevice = this.availableCameras[0];
    }

    onCodeResult(resultString: string): void {
        function replacer(key, value) {
            if (value instanceof Map) {
                return {
                    dataType: 'Map',
                    value: Array.from(value.entries()), // or with spread: value: [...value]
                };
            } else {
                return value;
            }
        }
        if (resultString.startsWith('BP:')) {
            resultString = JSON.stringify(cbor.decodeFirstSync(new Uint8Array(b45.decode(resultString.substr(3)))), replacer);
        }
        console.log(resultString);
        this.actionService.handleScan(resultString)
            .pipe(
                take(1),
                tap(index => console.log('saved', index))
            )
            .subscribe(
                (index: number) => this.router.navigateByUrl(`/tabs/details/${index}`)
                // TODO: Error handling
            );
    }

    switchCamera(): void {
        this.currentCameraIndex++;

        if (this.currentCameraIndex === this.availableCameras.length) {
            this.currentCameraIndex = 0;
        }

        this.currentDevice = this.availableCameras[this.currentCameraIndex];
    }

}
