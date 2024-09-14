<script>
import Main from "./Main.svelte";
    let colors = [
        "red",
        "pink",
        "yellow",
        "orange",
        "purple",
        "green",
        "blue",
        "brown",
        "white",
        "gray",
    ];
</script>

<Main>
{#each colors as color, i}
<!-- svelte-ignore a11y-distracting-elements -->
<marquee class="right" behavior="alternate" direction="down" scrolldelay="{30 + i}" truespeed>
    <!-- svelte-ignore a11y-distracting-elements -->
    <marquee class="left" behavior="alternate" direction="right" scrolldelay="{30 + i}" truespeed>
        <div class="block" style="background-color: {color};"></div>
    </marquee>
</marquee>
{/each}

<h1>Did you mean to visit <a href="/">paprika.live/library</a>?</h1>
</Main>

<style>
    .right {
        position: fixed;
        width: 100vw;
        height: 100vh;
        margin: 0;
    }

    .left {
        margin: 0;
    }

    .block {
        width: 10em;
        height: 10em;
        border-radius: 100%;
    }

    h1 {
        color: white;
        position: fixed;
        width: 100vw;
        height: 100vh;
        margin: 0;
        align-content: center;
        text-align: center;
        font-size: 3em;
    }

    a {
        color: white;
    }
</style>