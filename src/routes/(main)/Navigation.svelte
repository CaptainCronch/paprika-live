<script>
	import '$lib/css/styles.css';
</script>

<nav>
    <a href="#"></a>
    <a href="#"></a>
    <a href="#"></a>
    <a href="#"></a>
</nav>
<slot></slot>

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