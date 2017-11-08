<?php
    if(isset($_GET)) {        
        $symbol = $_GET['symbol'];
        $isRealtime = isset($_GET['realtime']);
        $query_url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=compact&symbol={$symbol}&apikey=XJPOXPVZNXYML3L2";
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
        $lastPrice = +$latestRecord->{'4. close'};
        $lastOpen = +$latestRecord->{'1. open'};
        $lastVolume = number_format(+$latestRecord->{$volumeFieldName});
        $daysRange = +$latestRecord->{'3. low'} . ' - ' . +$latestRecord->{'2. high'};
        # TODO: close
        
       
       # hard-coded
        date_default_timezone_set('America/New_York');
        $dates = array();
        $prices = array();
        $volumes = array();
        foreach ($time_series as $date => $record) {
            array_push($dates, $date);
            array_push($prices, +$record->{'4. close'});
            array_push($volumes, +$record->{$volumeFieldName});
        }
        
        $change = $prices[0] - $prices[1];
        $changePer = round($change / $prices[1] * 100, 2) . '%';
        $changeStr = round($change, 2) . ' (' . $changePer . ')';
        
        $wrap = array("Stock Ticker" => $symbol, "Last Price" => $lastPrice, "Open" => $lastOpen, 'TimeStamp' => $timeStamp, "Day's Range" => $daysRange, "Volume" => $lastVolume, "Change" => $changeStr, 'dates' => $dates, 'prices' => $prices, 'volumes' => $volumes, 'change' => $change, 'changePer' => $changePer, 'prevPrice' => $prices[1]);
        $obj = json_encode($wrap, JSON_PRETTY_PRINT);
        echo $obj;
    }
    else {
        header("HTTP/1.0 404 only support get method");
    }
?>