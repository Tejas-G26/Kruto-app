## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Supabase Tables 

# user table

CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    profile_image_url TEXT,
    email TEXT,
    phone_number TEXT,
    date_of_birth TEXT,
    gender TEXT,
    location TEXT,
    occupation TEXT,
    relationship_status TEXT,
    bio TEXT,
    website_link TEXT,
    is_online boolean,
    last_seen TIMESTAMP

    created_at TIMESTAMP
);

# Bussiness listing table

CREATE TABLE business_listings (
    business_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    created_user_id TEXT,
    images_url TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    price_per_hour TEXT,
    price_per_day TEXT,
    price_per_week TEXT,
    security_deposit TEXT,
    minimum_rental_period TEXT,
    availability_start TEXT,
    availability_end TEXT,
    location_name TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    full_address TEXT,
    phone_number TEXT,
    email TEXT,
    brand TEXT,
    model TEXT,
    year TEXT,
    serial_number TEXT,
    condition TEXT,
    condition_note TEXT,
    is_available TEXT,
    special_instruction TEXT,
    terms_condition TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (created_user_id) REFERENCES users(user_id)
);

# Post table

CREATE TABLE posts (
    post_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT,
    image_url TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

# Post likes table

CREATE TABLE post_likes (
    like_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    post_id TEXT,
    user_id TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES posts(post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

# Comment table

CREATE TABLE comments (
    comment_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    post_id TEXT,
    user_id TEXT,
    comment_text TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES posts(post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

# comment likes table

CREATE TABLE comment_likes (
    like_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    comment_id TEXT,
    user_id TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (comment_id) REFERENCES comments(comment_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

# follow table

CREATE TABLE user_follows (
    follow_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    follower_id TEXT,
    following_id TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (follower_id) REFERENCES users(user_id),
    FOREIGN KEY (following_id) REFERENCES users(user_id)
);

# save post table

CREATE TABLE saved_posts (
    save_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT,
    post_id TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

# Conversations table
create table public.conversations (
  conversation_id uuid not null default gen_random_uuid (),
  user1_id text null,
  user2_id text null,
  created_at timestamp without time zone null default now(),
  constraint conversations_pkey primary key (conversation_id),
  constraint conversations_user1_id_user2_id_key unique (user1_id, user2_id),
  constraint conversations_user1_id_fkey foreign KEY (user1_id) references users (user_id) on delete CASCADE,
  constraint conversations_user2_id_fkey foreign KEY (user2_id) references users (user_id) on delete CASCADE
) TABLESPACE pg_default;

# message table
create table public.messages (
  message_id uuid not null default gen_random_uuid (),
  conversation_id uuid null,
  sender_id text null,
  receiver_id text null,
  message_text text null,
  created_at timestamp without time zone null default now(),
  constraint messages_pkey primary key (message_id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (conversation_id) on delete CASCADE,
  constraint messages_receiver_id_fkey foreign KEY (receiver_id) references users (user_id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (user_id) on delete CASCADE
) TABLESPACE pg_default;
