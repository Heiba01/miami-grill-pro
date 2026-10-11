<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Order totals are computed in the database `place_order` function from current menu prices; the browser only sends item ids and quantities. Why: customers can't tamper with prices.
- Loyalty points are awarded by a database trigger when an order is marked completed; customers cannot edit their own points. Why: points are trustworthy.
- Staff/admin access is stored in `user_roles` and checked with `is_staff`/`has_role`; the first account to sign up becomes admin. Why: no privilege escalation via profile edits.
- Menu photos live in a private storage bucket and are shown via long-lived signed links. Why: the workspace blocks public buckets.
- Public menu is read via a server function with the publishable key so pages render with data. Why: SEO and fast first paint.
