<?php
// This static PHP build is compiled with mbregex/oniguruma disabled
// (static-php-cli hardcodes --disable-mbregex for mbstring), so mb_split()
// doesn't exist. Laravel's Illuminate\Support\Str::studly()/headline()/
// title()/wordCount() all call mb_split('\s+', $value) - always the same
// literal whitespace pattern, never anything more complex - so a narrow
// preg_split-based polyfill (PCRE, which IS compiled in) is safe here even
// though it isn't a general-purpose mb_split replacement.
if (!function_exists('mb_split')) {
    function mb_split(string $pattern, string $string, int $limit = -1): array|false
    {
        return preg_split('/' . $pattern . '/u', $string, $limit);
    }
}
