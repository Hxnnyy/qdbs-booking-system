
# Queens Dock Barbershop App

![Queens Dock Barbershop](public/og-image.png)

A comprehensive booking and management system for Queen's Dock Barbershop, allowing customers to book appointments with their preferred barbers and enabling staff to manage bookings, barbers, services, and business operations.

## Features

### Customer Features

- **Online Booking System**: Book appointments with your preferred barber
- **Service Selection**: Browse and select from available haircut and grooming services
- **Real-time Availability**: See real-time availability for barbers and time slots
- **Guest Booking**: Book appointments without creating an account
- **Booking Management**: View, modify, or cancel your bookings
- **Verification System**: Secure verification via SMS for guest bookings

### Admin Features

- **Dashboard**: Overview of bookings, revenue, and business performance
- **Calendar View**: Visual calendar interface for managing appointments
- **Barber Management**: Add, edit, and manage barber profiles, services, and availability
- **Service Management**: Configure services, prices, and durations
- **Client Management**: View and manage client information
- **Booking Management**: Manage all bookings, including rescheduling and cancellation
- **Holiday & Break Management**: Set barber holidays and lunch breaks
- **Import System**: Import existing bookings from CSV or manual entry
- **Notification Settings**: Configure email and SMS templates for booking confirmations and reminders

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Authentication, Database, Storage, Edge Functions)
- **Additional Libraries**: 
  - date-fns for date manipulation
  - react-hook-form for form handling
  - Tanstack Query for data fetching
  - recharts for data visualization
  - Framer Motion for animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for backend functionality)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd queens-dock-barbershop
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:5173

### Setting Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in the `supabase/migrations` directory to set up the database schema
3. Configure authentication providers in the Supabase dashboard
4. Set up the following secrets in your Supabase project:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_VERIFY_SID
   - TWILIO_PHONE_NUMBER
   - RESEND_API_KEY (for email functionality)

## Project Structure

```
queens-dock-barbershop/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin-specific components
│   │   ├── booking/         # Booking-related components
│   │   ├── ui/              # UI components (shadcn)
│   │   └── ...
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Page components
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── supabase/                # Supabase-related files and functions
└── ...
```

## User Guide

### Customer Booking Flow

1. Navigate to the booking page
2. Select your preferred barber
3. Choose a service
4. Select a date and time slot
5. Enter your personal information
6. Confirm your booking
7. For guest bookings, verify your phone number with the code sent via SMS

### Admin Dashboard

1. Login with admin credentials
2. Access the admin dashboard via the navigation menu
3. Use the dashboard to view booking statistics and recent bookings
4. Navigate to specific admin pages for managing bookings, barbers, services, etc.

### Managing Barbers

1. Go to the "Manage Barbers" page
2. Add new barbers, including their personal information and profile image
3. Edit existing barber details or service offerings
4. Set up working hours and lunch breaks for each barber
5. Configure holidays for barbers

### Managing Bookings

1. Go to the "Manage Bookings" page
2. View all bookings with filtering options (today, upcoming, past, etc.)
3. Edit booking details including service, date, time, and status
4. Cancel bookings if necessary
5. Use the calendar view for visual booking management

## API Documentation

The application uses Supabase for backend functionality, with the following main tables:

- `profiles`: User profiles
- `barbers`: Barber information
- `services`: Available services
- `bookings`: Customer bookings
- `opening_hours`: Barber working hours
- `barber_lunch_breaks`: Barber lunch breaks
- `barber_holidays`: Barber holiday periods
- `notification_templates`: Email and SMS templates

## Deployment

### Deploying to Lovable

1. Open your project in Lovable
2. Click on the "Publish" button in the top right
3. Follow the instructions to deploy your application

### Deploying to Netlify

1. Connect your repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build` or `yarn build`
   - Publish directory: `dist`
3. Set up the environment variables in Netlify (same as in the `.env` file)
4. Deploy the application

## Troubleshooting

### Common Issues

1. **Booking conflicts**: Ensure that there are no overlapping bookings or lunch breaks
2. **Calendar not showing events**: Check that the barber filter is set correctly
3. **SMS verification not working**: Verify Twilio credentials and phone number format

### Support

For issues or questions, please contact support at [your-email@example.com]

## License

[Your chosen license]

## Credits

This application was built with [Lovable](https://lovable.ai).
