<?php
    if(isset($_GET)) {        
        $symbol = $_GET['symbol'];
        $query_url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=compact&symbol={$symbol}&apikey=XJPOXPVZNXYML3L2";
        $content = file_get_contents($query_url);
        $obj = json_decode($content);
        
        if (!isset($obj) or isset($obj->{'Error Message'})) {
            echo $content;
            return;
        }
        
        $meta_data = $obj->{'Meta Data'};
        $time_series = $obj->{'Time Series (Daily)'};
        
        $timeStamp = $meta_data->{'3. Last Refreshed'};
        $latestRecord = $time_series->$timeStamp;
        
        $symbol = $meta_data->{'2. Symbol'};
        $lastPrice = +$latestRecord->{'4. close'};
        $lastOpen = +$latestRecord->{'1. open'};
        $lastVolume = number_format(+$latestRecord->{'6. volume'});
        $daysRange = +$latestRecord->{'3. low'} . '-' . +$latestRecord->{'2. high'};
        # TODO: close
        
       
       # hard-coded
        date_default_timezone_set('America/New_York');
        $records = array();
        foreach ($time_series as $date => $record) {
            array_push($records, array(strtotime($date), +$record->{'4. close'}, +$record->{'6. volume'}));
        }
        
        $change = round(($records[0][1] - $records[1][1]) / $records[0][1], 2);

        
        $wrap = array("Stock Ticker" => $symbol, "Last Price" => $lastPrice, "Open" => $lastOpen, 'TimeStamp' => $timeStamp, "Day's Range" => $daysRange, "Volume" => $lastVolume, "Change" => $change, 'series' => $records,);
        $obj = json_encode($wrap, JSON_PRETTY_PRINT);
        echo $obj;
    }
    else {
        echo json_encode(array('error' => 'only suport GET operation.'));
    }
?>