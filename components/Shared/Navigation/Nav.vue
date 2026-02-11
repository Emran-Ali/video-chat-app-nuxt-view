<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import DropdownMenu from '~/components/Shared/Popover/HoverDropdown.vue'
import Notification from '~/components/Shared/Navigation/Notification.vue'
import { useTeacherApplication } from '~/pinia/teacher-store/teacher-onboarding'
import { useSiteSettingsStore } from '~/pinia/site-settings/site-settings.js'
import type { MenuItem } from '~/types/user-account.type'

interface NavigationMenuItem {
  id: string | number
  title: string
  url: string
  isExternal?: boolean
  children: NavigationMenuItem[]
}

interface NavigationMenu {
  menuItems: NavigationMenuItem[]
}

type Props = {
  showTagList?: boolean
}

withDefaults(defineProps<Props>(), {
  showTagList: true,
})

const { $siteSettings } = useNuxtApp()
const siteSettingsStore = useSiteSettingsStore()

// Reactive computed property that ensures we have the latest site settings
const siteLogo = computed(() => {
  const settings = $siteSettings as Record<string, string> | undefined
  return (
    settings?.siteLogo || siteSettingsStore.getSiteSettings?.siteLogo || null
  )
})
const visible = ref(false)
const localePath = useLocalePath()
const authStore = useAuthStore()
const router = useRouter()
const commonStore = useCommonStore()
const onboardingStore = useTeacherApplication()

const menuItems = ref<MenuItem[]>([
  {
    label: 'Account',
    icon: 'User',
    // url: '/teacher/account',
    onClick: () => handleRoute(),
  },
  {
    label: 'Logout',
    icon: 'LogOut',
    onClick: () => authStore.logout(),
  },
])

const handleRoute = () => {
  const role = authStore.user?.role

  if (role === 'TEACHER') {
    router.push('/teacher/account')
  } else if (role === 'ADMIN') {
    router.push('/admin-test-call')
  } else {
    router.push('/student/account')
  }
}

const errorMessage = ref<string | null>(null)

const { data: navigationMenu } = useAsyncData<NavigationMenu>(
  'navigationMenu',
  async () => {
    try {
      const menu = commonStore.getNavigationMenu as unknown as NavigationMenu
      if (menu?.menuItems && menu.menuItems.length > 0) {
        return menu
      }

      await commonStore.fetchNavigationMenu(['main-menu', 'footer-menu'])
      return commonStore.getNavigationMenu as unknown as NavigationMenu
    } catch (err) {
      if (err instanceof Error) {
        errorMessage.value = err.message
      } else {
        errorMessage.value = 'Failed to load navigation menu'
      }
      return { menuItems: [] }
    }
  }
)

onMounted(() => {
  onboardingStore.fetchOnboardingAccess()
})
</script>

<template>
  <div class="w-full fixed top-0 left-0 z-[1001]" data-cy="main-navigation">
    {{ errorMessage }}
    <div
      class="bg-surface-section border-b pt-6 pb-4"
      data-cy="navigation-header"
    >
      <BaseContainer data-cy="main-navigation-container">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-10">
            <NuxtLink :to="localePath('/')" data-cy="brand-logo-link">
              <img
                v-if="siteLogo"
                :src="siteLogo"
                alt="Craft Music Logo"
                class="h-10"
              />
              <div v-else class="h-10 w-32" aria-label="Loading logo" />
            </NuxtLink>

            <!-- Desktop menu - hidden on small screens -->
            <ul
              class="hidden lg:flex items-center gap-5"
              data-cy="desktop-nav-menu"
            >
              <li
                v-for="item in navigationMenu?.menuItems"
                :key="item.id"
                class="flex items-center"
              >
                <NuxtLink
                  v-if="item.children.length === 0"
                  class="paragraph_black"
                  :to="item.isExternal ? item.url : localePath(item.url)"
                >
                  {{ item.title }}
                </NuxtLink>
                <DropdownMenu
                  v-else
                  :title="item.title"
                  :link="item.url"
                  :items="item.children"
                />
              </li>
            </ul>
          </div>

          <!-- Desktop CTA buttons - hidden on small screens -->
          <ClientOnly>
            <div class="flex items-center gap-5" data-cy="nav-action-container">
              <div
                v-if="!authStore.isAuthenticated"
                class="hidden md:flex items-center gap-5"
                data-cy="unauthenticated-nav-actions"
              >
                <NuxtLink
                  v-if="onboardingStore.canApply"
                  :to="localePath('/teacher/application')"
                  data-cy="become-teacher-link"
                >
                  <p class="paragraph_black text-nowrap">Become a teacher</p>
                </NuxtLink>

                <NuxtLink :to="localePath('/login')" data-cy="nav-login-link">
                  <Button
                    size="small"
                    variant="outlined"
                    rounded
                    class="!px-4"
                    data-cy="nav-login-button"
                    >Login
                  </Button>
                </NuxtLink>
                <NuxtLink
                  v-if="!authStore.isTeacher"
                  :to="localePath('/get-started')"
                >
                  <Button
                    size="small"
                    rounded
                    class="!px-4"
                    data-cy="find-teacher-button"
                    >Find your teacher
                  </Button>
                </NuxtLink>
              </div>

              <div
                class="flex items-center justify-center gap-2"
                data-cy="nav-user-menu-container"
              >
                <SharedPopoverMenu
                  v-if="authStore.isAuthenticated"
                  :menu-items="menuItems"
                  data-cy="user-dropdown-menu"
                >
                  <template #trigger="{ toggle }">
                    <Button
                      icon="pi pi-user"
                      class="p-button-outlined"
                      rounded
                      size="small"
                      data-cy="user-menu-toggle"
                      @click="toggle"
                    />
                  </template>
                </SharedPopoverMenu>
                <Notification v-if="authStore.isAuthenticated" />

                <!-- Hamburger menu button - visible only on small screens -->
                <button
                  class="md:hidden p-2 focus:outline-none"
                  aria-label="Toggle menu"
                  data-cy="mobile-menu-toggle"
                  @click="visible = true"
                >
                  <Menu :size="24" />
                </button>
              </div>
            </div>
          </ClientOnly>
        </div>
      </BaseContainer>
    </div>

    <!-- PrimeVue Drawer component -->
    <Drawer
      v-model:visible="visible"
      position="right"
      :dismissable="true"
      :closable="true"
      :block-scroll="true"
      data-cy="mobile-drawer"
      :base-z-index="999999"
    >
      <template #header>
        <div class="flex items-center pl-2" data-cy="drawer-header">
          <BaseGlobalIcon
            component-name="BrandIcon"
            data-cy="drawer-brand-icon"
          />
        </div>
      </template>

      <div class="p-2" data-cy="drawer-content">
        <ul class="space-y-4" data-cy="drawer-menu">
          <li v-for="item in navigationMenu?.menuItems" :key="item.id">
            <NuxtLink
              v-if="item.children.length === 0"
              :to="item.isExternal ? item.url : localePath(item.url)"
              class="text-sm"
            >
              <span @click="visible = false">{{ item.title }}</span>
            </NuxtLink>
            <DropdownMenu
              v-else
              :title="item.title"
              :link="item.url"
              :items="item.children"
              @click:item="visible = false"
            />
          </li>
          <li class="pt-4 border-t mt-4" data-cy="drawer-become-teacher-link">
            <NuxtLink
              v-if="!authStore.isAuthenticated && onboardingStore.canApply"
              :to="localePath('/teacher/application')"
              class="block text-sm"
              @click="visible = false"
              >Become a teacher
            </NuxtLink>
          </li>
        </ul>

        <div class="mt-6 space-y-3" data-cy="drawer-buttons-container">
          <NuxtLink :to="localePath('/login')" data-cy="drawer-login-link">
            <Button
              v-if="!authStore.isAuthenticated"
              size="small"
              variant="outlined"
              rounded
              class="w-full"
              data-cy="drawer-login-button"
              @click="visible = false"
              >Login
            </Button>
          </NuxtLink>
          <NuxtLink
            v-if="!authStore.isTeacher"
            :to="localePath('/get-started')"
            class="block"
          >
            <Button
              size="small"
              rounded
              class="w-full"
              data-cy="drawer-find-teacher-button"
              @click="visible = false"
              >Find your teacher</Button
            ></NuxtLink
          >
        </div>
      </div>
    </Drawer>

    <!-- Display error message if exists -->
    <div
      v-if="errorMessage"
      class="w-full bg-error-light text-error-dark p-2 text-center"
      data-cy="navigation-error-message"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
