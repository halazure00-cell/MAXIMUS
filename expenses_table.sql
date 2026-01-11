-- Create expenses table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid not null default auth.uid(), -- Link to the user
  amount numeric not null,
  category text not null, -- 'Fuel', 'Food', 'Service', 'Other'
  note text
);

-- Enable Row Level Security
alter table public.expenses enable row level security;

-- Create policies to allow users to see/edit only their own expenses
create policy "Users can view their own expenses" on public.expenses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
  
create policy "Users can update their own expenses" on public.expenses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own expenses" on public.expenses
  for delete using (auth.uid() = user_id);
