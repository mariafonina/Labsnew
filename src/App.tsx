import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { AdminRoute } from "./components/routing/AdminRoute";
import { ScrollToTop } from "./components/routing/ScrollToTop";
import { AppLayout } from "./layouts/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Login } from "./components/Login";
import { ResetPassword } from "./pages/ResetPassword";
import { SetupPassword } from "./pages/SetupPassword";
import { NotFound } from "./pages/NotFound";

// User pages
import { NewsPage } from "./pages/user/NewsPage";
import { CalendarPage } from "./pages/user/CalendarPage";
import { LibraryPage } from "./pages/user/LibraryPage";
import { RecordingsPage } from "./pages/user/RecordingsPage";
import { FAQPage } from "./pages/user/FAQPage";
import { FavoritesPage } from "./pages/user/FavoritesPage";
import { NotesPage } from "./pages/user/NotesPage";
import { ProfilePage } from "./pages/user/ProfilePage";

// Admin pages
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminEnrollments } from "./components/AdminEnrollments";
import { AdminUsers } from "./components/AdminUsers";
import { AdminQuestions } from "./components/AdminQuestions";
import { AdminNewsManager } from "./components/AdminNewsManager";
import { AdminEventsManager } from "./components/AdminEventsManager";
import { AdminInstructionsManager } from "./components/AdminInstructionsManager";
import { AdminRecordingsManager } from "./components/AdminRecordingsManager";
import { AdminFAQManager } from "./components/AdminFAQManager";
import { AdminEmailManager } from "./components/AdminEmailManager";
import { AdminInitialPasswordsManager } from "./components/AdminInitialPasswordsManager";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/setup-password/:token" element={<SetupPassword />} />

        {/* Protected user routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/news" replace />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="library/:id" element={<LibraryPage />} />
            <Route path="recordings" element={<RecordingsPage />} />
            <Route path="recordings/:id" element={<RecordingsPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/:productId" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section/new" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section/new-category" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section/category/:itemId/new" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section/instruction/:itemId/edit" element={<AdminProductsPage />} />
            <Route path="products/:productId/cohorts/:cohortId/:section/:itemId/edit" element={<AdminProductsPage />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUsers />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="questions/:questionId" element={<AdminQuestions />} />
            <Route path="news" element={<AdminNewsManager />} />
            <Route path="news/:newsId" element={<AdminNewsManager />} />
            <Route path="events" element={<AdminEventsManager />} />
            <Route path="events/:eventId" element={<AdminEventsManager />} />
            <Route path="instructions" element={<AdminInstructionsManager />} />
            <Route path="instructions/:instructionId" element={<AdminInstructionsManager />} />
            <Route path="recordings" element={<AdminRecordingsManager />} />
            <Route path="recordings/:recordingId" element={<AdminRecordingsManager />} />
            <Route path="faq" element={<AdminFAQManager />} />
            <Route path="faq/:faqId" element={<AdminFAQManager />} />
            <Route path="emails" element={<AdminEmailManager />} />
            <Route path="initial-passwords" element={<AdminInitialPasswordsManager />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
