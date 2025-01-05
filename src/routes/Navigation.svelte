<script>
	import '$lib/css/styles.css';
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    let { children } = $props();
</script>

<nav>
    <a href="#"></a>
    <a href="#"></a>
    <a href="#"></a>
    <a href="#"></a>
</nav>
{@render children?.()}

<style>
    nav {
        position: sticky;
        top: 10em;
        display: flex;
        align-content: space-between;
        justify-content: start;
        flex-direction: column;
        gap: 1em;

        & a {
            display: inline-block;
            width: 5em;
            height: 5em;
            background-color: red;
        }
    }
</style>