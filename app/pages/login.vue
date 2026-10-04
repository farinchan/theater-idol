<script setup lang="ts">
import { account } from '~/appwrite'

const route = useRoute()
const router = useRouter()
const { appName } = useAppName()
const { user, login, register, loginWithGoogle, syncGoogleProfilePicture, checkSession, isLoading, authError } = useAppwriteAuth()

useSeoMeta({
  title: 'Masuk / Daftar Akun - Theater Idol',
  description: 'Masuk atau buat akun baru di Theater Idol untuk menikmati fitur interaktif live chat, pembelian member premium, dan akses eksklusif.',
  robots: 'noindex, follow'
})

const mode = ref<'login' | 'register'>('login')
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isOAuthProcessing = ref(false)

// Handle Google OAuth callback saat dialihkan kembali dari Appwrite
onMounted(async () => {
  const oauthStatus = route.query.oauth as string | undefined
  const userId = route.query.userId as string | undefined
  const secret = route.query.secret as string | undefined

  if (oauthStatus === 'success' || (userId && secret)) {
    isOAuthProcessing.value = true
    localError.value = null
    successMessage.value = 'Memverifikasi autentikasi Google...'

    try {
      // Jika Appwrite mengembalikan token via query parameter
      if (userId && secret) {
        try {
          await account.createSession(userId, secret)
        } catch (e: any) {
          console.warn('[Google OAuth] createSession token note:', e?.message)
        }
      }

      // Ambil dan pastikan data sesi aktif tersimpan
      const currentUser = await checkSession()
      if (currentUser) {
        // Otomatis sinkronisasi foto profil Google jika belum ada avatar kustom
        await syncGoogleProfilePicture()

        successMessage.value = `Selamat datang, ${currentUser.name || 'Pengguna'}! Berhasil masuk dengan Google.`

        let target = '/profile'
        try {
          const saved = sessionStorage.getItem('oauth_redirect')
          if (saved) {
            target = saved
            sessionStorage.removeItem('oauth_redirect')
          } else if (route.query.redirect) {
            target = String(route.query.redirect)
          }
        } catch {}

        setTimeout(() => {
          router.replace(target)
        }, 800)
      } else {
        localError.value = 'Sesi akun Google tidak ditemukan. Silakan coba masuk kembali.'
      }
    } catch (err: any) {
      localError.value = err?.message || 'Gagal memproses otorisasi akun Google.'
    } finally {
      isOAuthProcessing.value = false
    }
  } else if (oauthStatus === 'failed') {
    localError.value = 'Login dengan Google dibatalkan atau tidak berhasil. Silakan coba kembali.'
    router.replace({ query: {} })
  }
})

// Trigger Google OAuth Login
const handleGoogleLogin = async () => {
  localError.value = null
  successMessage.value = null
  const redirectTarget = (route.query.redirect as string) || '/profile'
  await loginWithGoogle(redirectTarget)
}

const handleSubmit = async () => {
  localError.value = null
  successMessage.value = null

  if (!form.email || !form.password) {
    localError.value = 'Silakan isi email dan kata sandi.'
    return
  }

  if (form.password.length < 8) {
    localError.value = 'Kata sandi minimal harus 8 karakter.'
    return
  }

  if (mode.value === 'register') {
    if (!form.name.trim()) {
      localError.value = 'Nama lengkap / panggilan wota wajib diisi.'
      return
    }
    if (form.password !== form.confirmPassword) {
      localError.value = 'Konfirmasi kata sandi tidak cocok.'
      return
    }

    const res = await register(form.email, form.password, form.name)
    if (res.success) {
      successMessage.value = 'Akun berhasil dibuat! Mengalihkan ke profil...'
      setTimeout(() => {
        router.push('/profile')
      }, 1200)
    } else {
      localError.value = res.error || 'Pendaftaran gagal.'
    }
  } else {
    const res = await login(form.email, form.password)
    if (res.success) {
      successMessage.value = 'Berhasil masuk! Mengalihkan...'
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } else {
      localError.value = res.error || 'Gagal masuk. Periksa email atau kata sandi.'
    }
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-md space-y-6">
      <!-- Brand & Header -->
      <div class="text-center space-y-2">
        <NuxtLink to="/" class="inline-block group">
          <span class="font-extrabold text-2xl tracking-tight text-neutral-900 dark:text-white uppercase">{{ appName }}</span>
        </NuxtLink>

        <div>
          <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mt-2">
            {{ mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru' }}
          </h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Masuk atau daftar untuk mengakses fitur lengkap portal.
          </p>
        </div>
      </div>

      <!-- Main Card -->
      <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm space-y-6">
        <!-- Switch Tab Mode -->
        <div class="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60">
          <button
            type="button"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              mode === 'login'
                ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="mode = 'login'; localError = null; successMessage = null"
          >
            Masuk
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              mode === 'register'
                ? 'bg-white dark:bg-neutral-900 text-primary shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="mode = 'register'; localError = null; successMessage = null"
          >
            Daftar Baru
          </button>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          :disabled="isLoading || isOAuthProcessing"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/90 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-bold text-sm shadow-xs transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          @click="handleGoogleLogin"
        >
          <!-- Google G Logo SVG -->
          <svg class="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
          </svg>
          <span v-if="isOAuthProcessing">Memproses Otorisasi Google...</span>
          <span v-else>{{ mode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google' }}</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-1">
          <div class="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
          <span class="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap">
            atau gunakan email
          </span>
          <div class="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
        </div>

        <!-- Feedback Alert Messages -->
        <div
          v-if="localError || authError"
          class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5"
        >
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 flex-shrink-0" />
          <span>{{ localError || authError }}</span>
        </div>

        <div
          v-if="successMessage"
          class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5"
        >
          <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 flex-shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Form Fields -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              Nama Lengkap
            </label>
            <UInput
              v-model="form.name"
              type="text"
              placeholder="Contoh: Fajri"
              icon="i-lucide-user"
              size="md"
              class="w-full"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              Alamat Email
            </label>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="nama@email.com"
              icon="i-lucide-mail"
              size="md"
              class="w-full"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              Kata Sandi
            </label>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Minimal 8 karakter..."
              icon="i-lucide-lock"
              size="md"
              class="w-full"
              required
            />
          </div>

          <div v-if="mode === 'register'" class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              Konfirmasi Kata Sandi
            </label>
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Ulangi kata sandi..."
              icon="i-lucide-shield-check"
              size="md"
              class="w-full"
              required
            />
          </div>

          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            class="w-full justify-center rounded-2xl font-bold mt-2 shadow-md shadow-primary/25 cursor-pointer"
            :loading="isLoading && !isOAuthProcessing"
            :disabled="isOAuthProcessing"
          >
            {{ mode === 'login' ? 'Masuk Sekarang' : 'Daftar & Buat Akun' }}
          </UButton>
        </form>

        <!-- Security Notice -->
        <div class="pt-2 text-center border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
          <div class="flex items-center justify-center gap-1.5 font-medium">
            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-emerald-500" />
            <span>Enkripsi Aman & Verifikasi Akun Otomatis</span>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="text-center">
        <NuxtLink to="/" class="text-xs font-bold text-neutral-500 hover:text-primary transition-colors inline-flex items-center gap-1">
          <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
