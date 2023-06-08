import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsPositive, IsNumber } from "class-validator";




export class CreateDeliveryDto {
  @ApiProperty()
  owner_id: number;


  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  charge_id: string;

  @ApiProperty()
  payment_intent_id: string;

  @ApiProperty()
  payment_method_id: string;


  @ApiProperty()
  item_image_link: string;

  @ApiProperty()
  item_image_id: string;


  @ApiProperty()
  from_location: string;

  @ApiProperty()
  from_address: string;

  @ApiProperty()
  from_street: string;

  @ApiProperty()
  from_city: string;

  @ApiProperty()
  from_state: string;

  @ApiProperty()
  from_zipcode: number;

  @ApiProperty()
  from_country: string;

  @ApiProperty()
  from_place_id: string;

  @ApiProperty()
  from_lat: number;

  @ApiProperty()
  from_lng: number;

  @ApiProperty()
  from_person: string;

  @ApiProperty()
  from_person_phone: string;

  @ApiProperty()
  from_person_email: string;

  @ApiProperty()
  from_person_id_required: boolean;

  @ApiProperty()
  from_person_sig_required: boolean;


  @ApiProperty()
  to_location: string;

  @ApiProperty()
  to_address: string;

  @ApiProperty()
  to_street: string;

  @ApiProperty()
  to_city: string;

  @ApiProperty()
  to_state: string;

  @ApiProperty()
  to_zipcode: number;

  @ApiProperty()
  to_country: string;

  @ApiProperty()
  to_place_id: string;

  @ApiProperty()
  to_lat: number;

  @ApiProperty()
  to_lng: number;

  @ApiProperty()
  to_person: string;

  @ApiProperty()
  to_person_phone: string;

  @ApiProperty()
  to_person_email: string;

  @ApiProperty()
  to_person_id_required: boolean;

  @ApiProperty()
  to_person_sig_required: boolean;


  @ApiProperty()
  category: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  auto_accept_anyone: boolean;

  @ApiProperty()
  urgent: boolean;

  @ApiProperty()
  payout: number;

  @ApiProperty()
  penalty: number;

}

export class CreateDeliveryTrackingUpdateDto {
  @ApiProperty()
  user_id: number;

  @ApiProperty()
  delivery_id: number;


  @ApiProperty()
  icon_link?: string;

  @ApiProperty()
  icon_id?: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  carrier_lat: number;

  @ApiProperty()
  carrier_lng: number;

}

export class FindAvailableDeliveryDto {
  @ApiProperty()
  criteria: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

}

export class SearchDeliveriesDto {
  @ApiProperty()
  from_city?: string;

  @ApiProperty()
  from_state?: string;

  @ApiProperty()
  to_city?: string;

  @ApiProperty()
  to_state?: string;

}

export class SendDeliveryMessageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  body: string;

}


export class CreateDisputeSettlementOfferDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  message: string;


  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @ApiProperty()
  offer_amount: string;

}


export class CreateCarrierupdateLocationDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @ApiProperty()
  carrier_latest_lat: number;


  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @ApiProperty()
  carrier_latest_lng: number;

}