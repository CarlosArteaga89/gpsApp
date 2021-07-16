import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import {FirestorageService} from '../services/firestorage.service';
import {AlertController, LoadingController, ToastController} from '@ionic/angular';
import {LocationInterface} from '../interfaces/location';


declare const google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  mapa: any;
  direccion: string;
  lat: string;
  long: string;
  auntocompletado: { input: string };
  autocompleteItems: any[];
  location: any;
  placeid: any;
  googleAutocomplete: any;
  loading: any;
  toast: any;

  ubicacion: LocationInterface = {
    latitude: '',
    longitude: '',
    description: '',
  };

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    public zone: NgZone,
    private firestorageService: FirestorageService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertController: AlertController
  ) {
    this.googleAutocomplete = new google.maps.places.AutocompleteService();
    this.auntocompletado = { input: '' };
    this.autocompleteItems = [];
  }

  ngOnInit() {
    this.cargarMap();
  }

  cargarMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);
      const mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      this.obtenerCoordenadasDir(resp.coords.latitude, resp.coords.longitude);
      this.mapa = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.mapa.addListener('tilesloaded', () => {
        console.log('accuracy',this.mapa, this.mapa.center.lat());
        this.obtenerCoordenadasDir(this.mapa.center.lat(), this.mapa.center.lng());
        this.lat = this.mapa.center.lat();
        this.long = this.mapa.center.lng();
      });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  obtenerCoordenadasDir(lattitude, longitude) {
    console.log('Coordenadas de Direccion: '+lattitude+' '+longitude);
    const options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.direccion = '';
        const responseAddress = [];
        for (const [key, value] of Object.entries(result[0])) {
          if (value.length>0) {
            responseAddress.push(value);
          }
        }
        responseAddress.reverse();
        for (const value of responseAddress) {
          this.direccion += value+', ';
        }
        this.direccion = this.direccion.slice(0, -2);
      })
      .catch((error: any) =>{
        this.direccion = 'Direccion no Disponible!';
      });
  }

  mostrarCoordenadas(){
    this.ubicacion.latitude = this.lat;
    this.ubicacion.longitude = this.long;
    this.presentarAlert();
  }

  buscar(){
    if (this.auntocompletado.input === '') {
      this.autocompleteItems = [];
      return;
    }
    this.googleAutocomplete.getPlacePredictions({ input: this.auntocompletado.input },
      (predictions, status) => {
        this.autocompleteItems = [];
        this.zone.run(() => {
          predictions.forEach((prediction) => {
            this.autocompleteItems.push(prediction);
          });
        });
      });
  }


  resultadoBusqueda(item) {
    alert(JSON.stringify(item));
    this.placeid = item.place_id;
    console.log(this.placeid);
  }

  borrarBusqueda(){
    this.autocompleteItems = [];
    this.auntocompletado.input = '';
  }

  guardarUbicacion(){
    this.presentarLoading();
    this.firestorageService.createLocation(this.ubicacion).then(res => {
      this.loading.dismiss();
      this.presentarToast('Guardado con Exito');
    }).catch(error => {
      this.presentarToast('No se ha podido guardar');
    });
  }

  async presentarLoading() {
    this.loading = await this.loadingCtrl.create({
      cssClass: 'normal',
      message: 'Guardando...!'
    });
    await this.loading.present();
  }

  async presentarToast(msg: string) {
    this.toast = await this.toastCtrl.create({
      message: msg,
      duration: 5000,
      cssClass: 'toast'
    });
    this.toast.present();
  }

  async presentarAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Ubicacion',
      inputs: [
        {
          name: 'descripcion',
          type: 'text',
          placeholder: 'Descripcion'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (res) => {
            console.log(res.descripcion);
            this.ubicacion.description = res.descripcion;
            this.guardarUbicacion();
          }
        }
      ]
    });
    await alert.present();
  }

  onSubmit(values) {
    console.log(values);
  }

}
