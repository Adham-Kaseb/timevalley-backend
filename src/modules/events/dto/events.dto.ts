export class CreateEventDto {
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  speakers: string;
  desc: string;
  status?: string;
}

export class RsvpEventDto {
  userEmail: string;
}
