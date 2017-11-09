<?php
    if(isset($_GET)) {        
        $symbol = $_GET['symbol'];
        $isRealtime = isset($_GET['realtime']);
        $query_url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=full&symbol={$symbol}&apikey=XJPOXPVZNXYML3L2";
        if ($isRealtime) {
            $query_url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&interval=1min&symbol={$symbol}&apikey=XJPOXPVZNXYML3L2";
        }
        $content = file_get_contents($query_url);
        if (!$content) {
            header("HTTP/1.0 404 network error");
            return;
        }
        // echo $content;
        $obj = json_decode($content);
        
        if (!isset($obj) or isset($obj->{'Error Message'}) or isset($obj->{'Information'})) {
            // echo $content;
            header("HTTP/1.0 404 no content related to the query");
            return;
        }
        
        $meta_data = $obj->{'Meta Data'};
        $timeStamp = $meta_data->{'3. Last Refreshed'};
        if ($isRealtime) {
            # some different fields for realtime data
            $time_series = $obj->{'Time Series (1min)'};
            $latestRecord = $time_series->$timeStamp;
            $volumeFieldName = '5. volume';

        }
        else {
            $time_series = $obj->{'Time Series (Daily)'};
            # doubtable
            $latestRecord = $time_series->{explode(" ", $timeStamp)[0]};
            $volumeFieldName = '6. volume';
        }
        
        $symbol = $meta_data->{'2. Symbol'};
        $lastPrice = round(+$latestRecord->{'4. close'}, 2);
        $lastOpen = round(+$latestRecord->{'1. open'}, 2);
        $lastVolume = number_format(+$latestRecord->{$volumeFieldName});
        $daysRange = round(+$latestRecord->{'3. low'}, 2) . ' - ' . round(+$latestRecord->{'2. high'}, 2);
        # TODO: close
        
       
       # hard-coded
        date_default_timezone_set('America/New_York');
        $dates = array();
        $prices = array();
        $volumes = array();
        $count = 0;
        foreach ($time_series as $date => $record) {
            if ($count++ > 1500) { break; }
            array_push($dates, $date);
            array_push($prices, +$record->{'4. close'});
            array_push($volumes, +$record->{$volumeFieldName});
        }
        
        $lastUpdatedTime = $timeStamp;
        if (count(explode(" ", $timeStamp)) > 1) {
            $prevPrice = $prices[1];
        }
        else {
            $prevPrice = $prices[0];
            $lastUpdatedTime .= " 16:00:00";
        }
        $lastUpdatedTime .= ' EST';

        $change = $prices[0] - $prevPrice;
        $changePer = round($change / $prevPrice * 100, 2) . '%';
        $changeStr = number_format($change, 2, '.', '') . ' (' . $changePer . ')';
        
        $wrap = array("Stock Ticker" => $symbol, "Last Price" => $lastPrice, "Open" => $lastOpen, 'TimeStamp' => $lastUpdatedTime, "Day's Range" => $daysRange, "Volume" => $lastVolume, "Change" => $changeStr, 'dates' => $dates, 'prices' => $prices, 'volumes' => $volumes, 'change' => $change, 'changePer' => $changePer, 'prevPrice' => $prevPrice);
        $obj = json_encode($wrap, JSON_PRETTY_PRINT);
        echo $obj;
    }
    else {
        header("HTTP/1.0 404 only support get method");
    }
?>