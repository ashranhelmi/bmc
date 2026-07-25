<?php

namespace App\Support;

class LanAddress
{
    /**
     * The machine's own LAN-facing IP — determined server-side, not from
     * however the current request happened to be addressed. This is what
     * makes the Share Session screen correct even when the host opens the
     * page via `localhost` themselves: participants still get a real,
     * reachable address.
     *
     * Standard portable trick: open a UDP "connection" to a public address.
     * UDP is connectionless, so this sends no actual packets — it just makes
     * the OS resolve which local network interface/IP would be used for that
     * route, which is exactly the LAN-facing address we want. Works offline
     * too, since it's a routing-table lookup, not a real network call.
     *
     * Returns null if detection fails (e.g. no network interface at all) —
     * callers should fall back to the browser's own window.location.
     */
    public static function detect(): ?string
    {
        $socket = @stream_socket_client('udp://8.8.8.8:80', $errno, $errstr, 1);

        if (! $socket) {
            return null;
        }

        $localName = stream_socket_get_name($socket, false);
        fclose($socket);

        if (! $localName) {
            return null;
        }

        // $localName is "ip:port" — for IPv6 it would be "[ip]:port", but we
        // only care about the common LAN-IPv4 case here.
        $ip = explode(':', $localName)[0] ?? null;

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : null;
    }
}
