<template>
    <div>

    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '#imports'

useHead({
  link: [
    { rel: 'manifest', href: '/manifest.json' }
  ]
})

const router = useRouter()

onMounted( async () => {
    router.push('/login');
})
</script>

<style lang="scss" scoped>

</style>