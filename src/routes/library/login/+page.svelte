<script>
	import { onMount } from "svelte";

    let cookies = []
    onMount(() => {
        cookies = Array(randomInt(15) + 10)
    })

    let username
    let password
    let logged = false
    async function handleSubmit(event) { // name password
        if (logged) {moveCookie(); return}
		let response = await fetch("/library/api/user/login", {
			body: JSON.stringify({
				'name': username,
				'password': password,
			}),
            method: "PUT",
		})
		if (response.ok) {
            logged = true
            moveCookie()
		} else {
			let body = await response.text()
			alert(body)
		}
	}

    async function moveCookie() {
        if (cookies.length === 0) {return}
        let selected = cookies[randomInt(cookies.length)]
        selected.style = "top: 0; left: 0;"
        await timeout(200)
        selected.style = "top: -25em; left: 0;"
        selected.firstElementChild.style = "rotation: 0deg; scale: 2;"
        await timeout(300)
        selected.style = "top: 0; left: 0; z-index: 5;"
        selected.firstElementChild.style = "rotation: 0deg; scale: 3;"
        selected.firstElementChild.firstElementChild.textContent = "Logged in!"
        selected.firstElementChild.firstElementChild.style = "padding: 5px;"
        await timeout(1000)
        selected.style = "top: 0em; left: -100vw; z-index: 5;"
    }

    /** @param {Event} event */
    async function jarClick(event) {
        cookies = [] // refreshes jar with newly generated cookies
        event.target.style = "scale: 1.1;"
        await timeout(100)
        cookies = []
        event.target.style = "scale: 1.1; rotate: 5deg;"
        await timeout(100)
        cookies = []
        event.target.style = "scale: 1.1; rotate: -5deg;"
        await timeout(100)
        cookies = []
        event.target.style = "scale: 1.1; rotate: 5deg;"
        await timeout(100)
        cookies = []
        event.target.style = "scale: 1.1; rotate: -5deg;"
        await timeout(100)
        cookies = []
        event.target.style = ""
    }

    function randomInt(max) { // exclusive
        console.log(Math.floor(Math.random() * max))
        return Math.floor(Math.random() * max);
    }

    function randomRange(min, max) { // inclusive, exclusive, continuous floating-point number range
        return Math.random() * (max - min) + min;
    }

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
</script>

<svelte:head>
    <title>Login</title>
	<meta name="description" content="Login user"/>
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="cookie-jar" on:click={jarClick}> <!-- ignore accessibility warnings because this is a minor purely visual and decorative interaction -->
    {#each cookies as cookie, i}
        <div class="cookie-container" style={`top:${randomRange(-5, 5)}em; left:${randomRange(-4, 4)}em;`} bind:this={cookies[i]}>
            <div class={"cookie cookie" + (randomInt(4) + 1)} style={`rotate:${randomRange(0, 359)}deg; scale:${randomRange(0.8, 1.4)};`}>
                <span class="cookie-text"></span>
            </div>
        </div>
    {/each}
</div>

<div class="login-form">
    <input type="text" id="username" name="username" placeholder="username" bind:value={username}>
    <input type="password" id="password" name="password" placeholder="password" bind:value={password}>
    <button id="login-submit" on:click={handleSubmit}>Login</button>
    {#if logged}
    <button on:click={() => {window.href = "/library"}}>Return</button>
    {/if}
</div>

<style>
    button {
        display: block;
        width: 50%;
        padding: 10px;
        background-color: #f1f1f1;
        font-size: 1.2em;
        font-weight: 500;
    }

    .login-form {
        width: 18em;
        height: 12em;
        margin-top: 12vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        background-image: url("$lib/images/white-marble-texture.jpg");
        padding: 2em;
        border-radius: 5px;
        box-shadow: 0px 10px 20px 10px rgb(0,0,0);
    }

    .cookie-jar {
        margin-top: 2vh;
        width: 25em;
        height: 30em;
        pointer-events: all;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cookie-jar::after {
        content: "";
        position: relative;
        width: 25em;
        height: 30em;
        background-image: url("$lib/images/cookies/Glass Jar - 1780x2000.png");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transition: all 0.2s;
    }

    .cookie-text {
        font-weight: 600;
        background-color: var(--beige);
        border-radius: 5px;
        padding: 0px;
    }

    .cookie {
        position: relative;
        width: 8em;
        height: 8em;
        left: 8em;
        top: 13em;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        transition: all 0.2s;
        filter: drop-shadow(0px 0px 10px var(--black));
        pointer-events: none;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .cookie-container {
        position: relative;
        width: 0;
        height: 0;
        transition: all 0.2s;
        pointer-events: none;
    }

    .cookie1 {background-image: url("$lib/images/cookies/American Cookie - 1372x1347.png");}
    .cookie2 {background-image: url("$lib/images/cookies/Cookie - 1500x1500.png");}
    .cookie3 {background-image: url("$lib/images/cookies/Cookies - 800x800.png");}
    .cookie4 {background-image: url("$lib/images/cookies/Cookies - 1372x1347.png");}

</style>