# Asstream V2 🚀

Welcome to **Asstream V2**, the new and redesigned version of the content management and streaming system. This project is a powerful CMS (Content Management System) architecture that autonomously generates JSON feeds compatible with Roku Direct Publisher, simplifying the administration of live channels and VOD.

## 🌟 What's New in V2

This version has been built from scratch to bring substantial improvements in performance, security, and user experience:

- **Migration to Next.js App Router**: Transition to server components (`RSC`) and `Server Actions` to eliminate dependency on a heavy REST framework and improve UI load times.
- **Supabase SSR Authentication**: Amazingly secure authentication with the new Supabase standard, including password recovery flow and database profiles protected with **Row Level Security (RLS)**.
- **Revamped Dashboard Design**: A premium interface featuring a unified sidebar, native TailwindCSS, Shadcn UI, tabbed navigation, and toast notifications with Sonner.
- **Native API and CDN Caching (ISR)**: Routes generated and injected using Next.js CDN memory (Stale-While-Revalidate) facing the client (Roku), protecting the database from massive request bottlenecks.

## ✨ Main Features

1. **Category and Channel Manager**: Full CRUD-style control. Comprehensive support for categorizing content based on the Roku format (`movies`, `liveFeeds`, `tvSpecials`...).
2. **VOD Auto-Completion with TMDB**: Forget searching for covers or descriptions for your series and movies. Type the name, and Asstream queries the TMDB API in the backend to auto-complete the entire form.
3. **Automatic Validation of "TV Specials" (Twitch)**: Are you a streamer or do you want to add a streamer to the grid? Add them to "tvSpecials", and the engine will iterate asynchronously, extracting the pure HLS (m3u8) code using the `twitch-m3u8` library. If the streamer is not live, they **disappear from the feed** to avoid broken links.
4. **Live Health-Checks for `liveFeeds`**: If a 24/7 transmission channel goes down, the server will perform an asynchronous ping with a *Timeout* to the HTTP protocol. If there is no connection, it will be hidden, protecting the ecosystem for your end users' TVs.

## 🛠 Local Installation

### Requirements
- Node.js version >= 18+
- A configured [Supabase](https://supabase.com/) project.
- A TheMovieDB (TMDB) API key.

### Steps
1. Clone the repository and install the dependencies:
   ```bash
   npm install
   ```
2. Rename `.env.example` to `.env.local` (or just `.env` depending on your environment) and fill in your master variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   TMDB_API_KEY=your_tmdb_api_key
   ```
3. Configure the database. Go to the SQL query panel of your Supabase project and run the entire content of the `supabase/schema.sql` file. This will create the ecosystem of categories, channels, and enable privacy policies.
4. Start development mode!
   ```bash
   npm run dev
   ```

## 📡 Main Feed Endpoint

The generator file to be injected as a JSON Feed to Roku or players resides at:

`GET /api/feed`

> 💡 **Tip:** Don't worry about the user flow. The feed API has designated RLS rules to allow public reads and is shielded by a local cache scheduled in 5-minute bursts, guaranteeing resilience without extra costs to your DB.

---

Developed with skill and innovation for the future of iterative content streaming.
