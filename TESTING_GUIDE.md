# Testing Guide: Authentication & Dashboard

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure Supabase is configured:
   - Check `.env.local` for Supabase credentials
   - Or verify environment variables in Vercel

3. Start the development server:
   ```bash
   npm run dev
   ```

## Test Scenarios

### 1. Home Page

**Test:** Visit home page
- URL: http://localhost:3000
- Expected: See "Blackfire Service" heading
- Expected: See "Get Started" and "Sign Up" buttons (if not logged in)
- Expected: See "Go to Dashboard" button (if logged in)

### 2. Signup Flow

**Test:** Create a new account
1. Visit http://localhost:3000/signup
2. Enter email: `test@example.com`
3. Enter password: `password123` (min 8 chars)
4. Enter confirm password: `password123`
5. Click "Create Account"

**Expected Results:**
- Success message appears: "Account created! Check your email to confirm."
- Redirects to login page with message
- Email sent to inbox (check Supabase Auth settings)

**Error Cases to Test:**
- Invalid email format → Shows error "Invalid email address"
- Password too short → Shows error "Password must be at least 8 characters"
- Passwords don't match → Shows error "Passwords don't match"
- Email already exists → Shows Supabase error message

### 3. Login Flow

**Test:** Login with existing account
1. Visit http://localhost:3000/login
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Sign In"

**Expected Results:**
- Redirects to /dashboard
- Sidebar shows on the left
- Header shows user email in dropdown
- Dashboard shows stats cards

**Error Cases to Test:**
- Wrong email → Shows error "Invalid login credentials"
- Wrong password → Shows error "Invalid login credentials"
- Unconfirmed email → Shows error message (depends on Supabase settings)

### 4. Dashboard Navigation

**Test:** Navigate between pages
1. Login and visit dashboard
2. Click "Portfolio" in sidebar
3. Click "Watchlist" in sidebar
4. Click "Stocks" in sidebar
5. Click "Notes" in sidebar
6. Click "Dashboard" to return home

**Expected Results:**
- Each page shows correct heading
- Active route is highlighted in sidebar
- Placeholder content shows "coming soon"
- URL updates correctly

### 5. Route Protection

**Test:** Access protected routes without auth
1. Logout (if logged in)
2. Try to visit http://localhost:3000/dashboard

**Expected Results:**
- Immediately redirects to /login
- URL shows /login?redirectTo=/dashboard

**Test:** Access auth pages while logged in
1. Login
2. Try to visit http://localhost:3000/login

**Expected Results:**
- Immediately redirects to /dashboard

### 6. User Dropdown Menu

**Test:** User menu functionality
1. Login and visit dashboard
2. Click avatar/initials in top right
3. See user email displayed
4. "Profile" option is disabled (not implemented)
5. Click "Log out"

**Expected Results:**
- Dropdown opens with user info
- Email is displayed correctly
- Initials are generated from email
- Logout redirects to /login
- Cannot access /dashboard after logout

### 7. Logout Flow

**Test:** Logout from dashboard
1. Login
2. Click user avatar
3. Click "Log out"

**Expected Results:**
- Redirects to /login
- Session is cleared
- Cannot access /dashboard
- Home page shows "Get Started" button

### 8. Session Persistence

**Test:** Session survives page refresh
1. Login
2. Navigate to /dashboard
3. Refresh page (F5 or Cmd+R)

**Expected Results:**
- Still logged in
- Dashboard still accessible
- User info still shows in header

### 9. Responsive Design

**Test:** Mobile view
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Select iPhone or responsive mode
4. Test all pages

**Expected Results:**
- Sidebar adapts to mobile (may need improvement)
- Forms are usable on mobile
- Buttons are tappable
- Text is readable

### 10. Form Validation

**Test:** Client-side validation
1. Visit /signup
2. Try to submit empty form
3. Try invalid email format
4. Try short password

**Expected Results:**
- HTML5 validation prevents submission
- Browser shows error messages
- Form highlights invalid fields

## Common Issues & Solutions

### Issue: "Failed to fetch" or network error
**Solution:**
- Check if Supabase URL and keys are correct
- Verify Supabase project is active
- Check browser console for CORS errors

### Issue: Email confirmation not working
**Solution:**
- Check Supabase dashboard → Authentication → Email Templates
- Ensure email provider is configured
- Check spam folder
- For dev: disable email confirmation in Supabase

### Issue: Redirects not working
**Solution:**
- Check middleware.ts is in project root
- Verify Next.js version supports middleware
- Clear browser cache
- Restart dev server

### Issue: Styles not loading
**Solution:**
- Check Tailwind CSS is configured
- Verify globals.css is imported in layout
- Run `npm install` again
- Clear .next folder and restart

### Issue: "Module not found" errors
**Solution:**
- Run `npm install` to install new dependencies
- Check package.json has all required packages
- Restart dev server

## Manual Testing Checklist

- [ ] Home page loads
- [ ] Can navigate to signup
- [ ] Can create account with valid data
- [ ] Cannot create account with invalid data
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] Dashboard loads after login
- [ ] User email shows in header
- [ ] Can navigate all sidebar links
- [ ] Active route is highlighted
- [ ] User dropdown opens
- [ ] Logout works
- [ ] Protected routes redirect when logged out
- [ ] Auth pages redirect when logged in
- [ ] Session persists on refresh
- [ ] Works on mobile view
- [ ] No console errors

## Automated Testing (Future)

### Unit Tests
- Test auth actions (login, signup, logout)
- Test session utilities
- Test form validation schemas

### Integration Tests
- Test full signup flow
- Test full login flow
- Test logout flow
- Test route protection

### E2E Tests (Playwright)
- Complete user journey
- Form submissions
- Navigation flows
- Error handling

## Performance Testing

### Metrics to Check
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Lighthouse score
- Bundle size

### Commands
```bash
# Production build
npm run build

# Analyze bundle
npm run build -- --analyze
```

## Security Testing

### Check for:
- [ ] CSRF protection (Server Actions handle this)
- [ ] XSS vulnerabilities (React escapes by default)
- [ ] SQL injection (Supabase handles this)
- [ ] Session fixation (Supabase handles this)
- [ ] Rate limiting (implement in future)
- [ ] Password requirements (8+ chars minimum)

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Notes

- Email confirmation is optional - can be disabled in Supabase
- For local testing, use Supabase local dev or test project
- Production testing should use separate Supabase project
- Consider adding test user accounts for QA
