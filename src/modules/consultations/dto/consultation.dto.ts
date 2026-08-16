export class CreateConsultationDto {
  title: string;
  consultantName?: string;
  consultantTitle?: string;
  consultantAvatar?: string;
  category: string;
  description: string;
  duration: string;
  price?: number;
  currency?: string;
  bookingUrl?: string;
  tags?: string[];
  isPublished?: boolean;
  orderIndex?: number;
}

export class UpdateConsultationDto {
  title?: string;
  consultantName?: string;
  consultantTitle?: string;
  consultantAvatar?: string;
  category?: string;
  description?: string;
  duration?: string;
  price?: number;
  currency?: string;
  bookingUrl?: string;
  tags?: string[];
  isPublished?: boolean;
  orderIndex?: number;
}

export class BookConsultationDto {
  consultationId?: string;
  consultationTitle?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  notes?: string;
}
