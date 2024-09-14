<script>

</script>

<div>
    <slot></slot>
</div>

<style>
    div {
        overflow-x: hidden;
        display: flex;
        justify-content: center;
        align-items: start;
        gap: 3em;
        padding: 10em 0;
        background-image: linear-gradient(rgb(10, 10, 10), 15rem, rgb(125, 125, 125)),
                url('$lib/images/botanical-pattern.jpg');
        background-blend-mode: multiply;
        min-height: 150vh;
        margin: 0;
        background-size: 30rem;
        background-repeat: repeat;
    }
    
</style>