<script setup lang="ts">
const router = useRouter()
const { appName } = useAppName()
const { user, login, register, isLoading, authError } = useAppwriteAuth()

const mode = ref<'login' | 'register'>('login')
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const localError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// If already logged in, redirect to profile
watchEffect(() => {
  if (user.value) {
    // Optionally redirect if desired
  }
})

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
            class="w-full justify-center rounded-2xl font-bold mt-2 shadow-md shadow-primary/25"
            :loading="isLoading"
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
