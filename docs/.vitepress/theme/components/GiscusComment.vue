<template>
  <div style="margin-top: 24px">
    <Giscus
      id="comments"
      repo="haovei/site"
      repoid="R_kgDOLx5gaw"
      category="General"
      categoryid="DIC_kwDOLx5ga84Cf7S3"
      mapping="pathname"
      term="Welcome to giscus!"
      reactionsenabled="1"
      emitmetadata="0"
      inputposition="top"
      loading="lazy"
      :theme="isDark ? 'dark' : 'light'"
      :key="route.path"
    ></Giscus>
  </div>
</template>

<script setup>
import Giscus from "@giscus/vue";
import { useRoute, useData } from "vitepress";

const route = useRoute();
const { isDark } = useData();
</script>
